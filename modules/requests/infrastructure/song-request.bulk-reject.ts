/** Includes legacy null/missing status records shown in Pending in Admin. */
export function openRequestResetFilter(cutoff: Date) {
  return {
    createdAt: {$lte: cutoff},
    $or: [
      {status: {$in: ["pending", "reviewing"]}},
      {status: {$exists: false}},
      {status: null},
    ],
  };
}
