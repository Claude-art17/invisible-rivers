exports.handler = async (event) => {
  const SUPABASE_URL = 'https://neqwiaprxwwjtycqwcjc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcXdpYXByeHd3anR5Y3F3Y2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MjY1ODYsImV4cCI6MjEwMDAwMjU4Nn0.KyGmgvkrr-2wguBV1wfglVaMOMtoqWQNQYuePap3188';

  const { projection_text, projection_files, home_text, home_files, comment } = JSON.parse(event.body);

  async function uploadFiles(files) {
    const urls = [];
    if (files && files.length) {
      for (const file of files) {
        const buf = Buffer.from(file.data, 'base64');
        const filename = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const r = await fetch(SUPABASE_URL + '/storage/v1/object/images/' + filename, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'apikey': SUPABASE_KEY,
            'Content-Type': file.type || 'image/jpeg'
          },
          body: buf
        });
        if (r.ok) {
          urls.push(SUPABASE_URL + '/storage/v1/object/public/images/' + filename);
        }
      }
    }
    return urls;
  }

  const projection_image_urls = await uploadFiles(projection_files);
  const home_image_urls = await uploadFiles(home_files);

  await fetch(SUPABASE_URL + '/rest/v1/submissions', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      name: '匿名',
      projection_text: projection_text || '',
      projection_image_urls: projection_image_urls,
      home_text: home_text || '',
      home_image_urls: home_image_urls,
      comment: comment || ''
    })
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
