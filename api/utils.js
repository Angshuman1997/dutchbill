async function mergeAndSummarize(pay, receive) {
  // Create a new object to hold the merged results
  const result = {};

  // Helper function to add entries to the result object
  const addEntries = (entries) => {
    for (const [key, value] of Object.entries(entries)) {
      result[key] = (result[key] || 0) + value;
    }
  };

  // Process both 'pay' and 'receive' objects
  addEntries(pay);
  addEntries(receive);

  // Transform the result object into the desired array format
  return Object.entries(result).map(([key, value]) => ({
    _id: key,
    amount: value,
    type: value >= 0 ? "receive" : "pay",
  }));
}

module.exports = { mergeAndSummarize };