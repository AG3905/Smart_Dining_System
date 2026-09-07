import { PoolClient } from 'pg';

export interface TableNode {
  id: string;
  table_number: string;
  capacity: number;
  grid_row: number;
  grid_col: number;
  status: 'free' | 'occupied' | 'reserved';
  order_status?: string | null;
  seated_at?: string | null;
}

export interface Cluster {
  tables: TableNode[];
  combinedCapacity: number;
}

export const W_WAIT = 1;
export const W_SIZE = 2;
export const VIP_BOOST = 1000;

/**
 * 1. Best-fit single table: smallest free table with capacity >= group_size.
 */
export function findBestSingleTable(tables: TableNode[], groupSize: number): TableNode | null {
  const candidates = tables.filter((t) => t.status === 'free' && t.capacity >= groupSize);
  if (candidates.length === 0) return null;

  // Sort by smallest capacity first, then by table_number
  candidates.sort((a, b) => a.capacity - b.capacity || a.table_number.localeCompare(b.table_number));
  return candidates[0];
}

/**
 * 2. BFS/DFS 4-directional adjacency cluster finder for free tables.
 */
export function findAdjacencyClusters(tables: TableNode[]): Cluster[] {
  const freeTables = tables.filter((t) => t.status === 'free');
  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  // Helper to check 4-directional grid adjacency
  const isAdjacent = (a: TableNode, b: TableNode) => {
    const rowDiff = Math.abs(a.grid_row - b.grid_row);
    const colDiff = Math.abs(a.grid_col - b.grid_col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  for (const table of freeTables) {
    if (visited.has(table.id)) continue;

    // Start BFS cluster exploration
    const currentCluster: TableNode[] = [];
    const queue: TableNode[] = [table];
    visited.add(table.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      currentCluster.push(current);

      for (const neighbor of freeTables) {
        if (!visited.has(neighbor.id) && isAdjacent(current, neighbor)) {
          visited.add(neighbor.id);
          queue.push(neighbor);
        }
      }
    }

    const combinedCapacity = currentCluster.reduce((sum, t) => sum + t.capacity, 0);
    clusters.push({ tables: currentCluster, combinedCapacity });
  }

  return clusters;
}

/**
 * Find best cluster of adjacent free tables whose combined capacity fits group_size.
 */
export function findBestCluster(tables: TableNode[], groupSize: number): Cluster | null {
  const clusters = findAdjacencyClusters(tables);
  const fittingClusters = clusters.filter((c) => c.combinedCapacity >= groupSize);

  if (fittingClusters.length === 0) return null;

  // Sort by smallest combined capacity first, then smallest count of tables
  fittingClusters.sort(
    (a, b) => a.combinedCapacity - b.combinedCapacity || a.tables.length - b.tables.length
  );
  return fittingClusters[0];
}

/**
 * Calculate Priority Score
 */
export function calculatePriorityScore(waitMinutes: number, groupSize: number, isVip: boolean = false): number {
  return waitMinutes * W_WAIT + groupSize * W_SIZE + (isVip ? VIP_BOOST : 0);
}

/**
 * DB Allocation Function: Attempts single table fit or cluster fit for a reservation.
 */
export async function attemptAllocation(
  client: PoolClient,
  reservationId: string,
  restaurantId: string,
  groupSize: number
): Promise<{ allocated: boolean; tableIds: string[]; method?: 'single' | 'cluster' }> {
  // Lock free tables
  const tablesRes = await client.query(
    'SELECT id, table_number, capacity, grid_row, grid_col, status FROM tables WHERE restaurant_id = $1 AND status = $2 FOR UPDATE',
    [restaurantId, 'free']
  );
  const freeTables: TableNode[] = tablesRes.rows;

  // 1. Try single table
  const singleTable = findBestSingleTable(freeTables, groupSize);
  if (singleTable) {
    // Allocate single table
    await client.query(
      "UPDATE reservations SET status = 'seated', confirmed_at = COALESCE(confirmed_at, NOW()), seated_at = NOW() WHERE id = $1",
      [reservationId]
    );
    await client.query(
      'INSERT INTO reservation_tables (reservation_id, table_id) VALUES ($1, $2)',
      [reservationId, singleTable.id]
    );
    await client.query(
      "UPDATE tables SET status = 'occupied', order_status = 'seated', seated_at = NOW() WHERE id = $1",
      [singleTable.id]
    );

    return { allocated: true, tableIds: [singleTable.id], method: 'single' };
  }

  // 2. Try cluster table fit
  const cluster = findBestCluster(freeTables, groupSize);
  if (cluster) {
    const clusterTableIds = cluster.tables.map((t) => t.id);

    await client.query(
      "UPDATE reservations SET status = 'seated', confirmed_at = COALESCE(confirmed_at, NOW()), seated_at = NOW() WHERE id = $1",
      [reservationId]
    );

    for (const tId of clusterTableIds) {
      await client.query(
        'INSERT INTO reservation_tables (reservation_id, table_id) VALUES ($1, $2)',
        [reservationId, tId]
      );
      await client.query(
        "UPDATE tables SET status = 'occupied', order_status = 'seated', seated_at = NOW() WHERE id = $1",
        [tId]
      );
    }

    return { allocated: true, tableIds: clusterTableIds, method: 'cluster' };
  }

  return { allocated: false, tableIds: [] };
}

/**
 * Re-run allocation engine against waiting queue whenever a table becomes free.
 */
export async function reallocateWaitingQueue(
  client: PoolClient,
  restaurantId: string
): Promise<number> {
  let allocatedCount = 0;

  // Lock waiting queue entries
  const queueRes = await client.query(
    `SELECT w.id as queue_id, w.reservation_id, r.group_size, r.is_vip 
     FROM waiting_queue w 
     JOIN reservations r ON w.reservation_id = r.id 
     WHERE w.restaurant_id = $1 AND w.status = 'waiting' 
     ORDER BY w.priority_score DESC, w.joined_at ASC 
     FOR UPDATE`,
    [restaurantId]
  );

  for (const row of queueRes.rows) {
    const result = await attemptAllocation(client, row.reservation_id, restaurantId, row.group_size);
    if (result.allocated) {
      await client.query(
        "UPDATE waiting_queue SET status = 'allocated' WHERE id = $1",
        [row.queue_id]
      );
      allocatedCount++;
    }
  }

  return allocatedCount;
}
