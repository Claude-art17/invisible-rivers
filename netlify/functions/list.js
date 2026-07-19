exports.handler = async () => {
  const SUPABASE_URL = 'https://neqwiaprxwwjtycqwcjc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcXdpYXByeHd3anR5Y3F3Y2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MjY1ODYsImV4cCI6MjEwMDAwMjU4Nn0.KyGmgvkrr-2wguBV1wfglVaMOMtoqWQNQYuePap3188';

  const r = await fetch(SUPABASE_URL + '/rest/v1/submissions?select=*&order=created_at.desc', {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    }
  });
  const data = await r.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
};
