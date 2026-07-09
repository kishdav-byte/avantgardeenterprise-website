async function test() {
  const url = 'https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json';
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (!res.ok) {
       console.log("Headers:", Object.fromEntries(res.headers.entries()));
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
test();
