async function test() {
  const settingsUrl = 'https://ai-admin-414225355758.us-central1.run.app/api/settings';
  const callbacksUrl = 'https://ai-admin-414225355758.us-central1.run.app/api/callbacks';
  try {
    console.log("Fetching settings from:", settingsUrl);
    const settingsRes = await fetch(settingsUrl);
    console.log("Settings status:", settingsRes.status);
    if (settingsRes.ok) {
      const data = await settingsRes.json();
      console.log("Settings data keys:", Object.keys(data));
      console.log("Current Voice:", data.voice);
    }

    console.log("Fetching callbacks from:", callbacksUrl);
    const callbacksRes = await fetch(callbacksUrl);
    console.log("Callbacks status:", callbacksRes.status);
    if (callbacksRes.ok) {
      const data = await callbacksRes.json();
      console.log("Callbacks count:", data.callbacks ? data.callbacks.length : 0);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
test();
