exports.handler = async (event) => {
  const SUPABASE_URL = 'https://neqwiaprxwwjtycqwcjc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcXdpYXByeHd3anR5Y3F3Y2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MjY1ODYsImV4cCI6MjEwMDAwMjU4Nn0.KyGmgvkrr-2wguBV1wfglVaMOMtoqWQNQYuePap3188';

  const { name, projection_text, projection_files, home_text, home_files, comment, mood } = JSON.parse(event.body);

  /* ── 剥离照片隐藏信息（EXIF/GPS） ── */
  function stripMetadata(buf) {
    if (buf.length < 4) return buf;
    if (buf[0] === 0xFF && buf[1] === 0xD8) return stripJpeg(buf);
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return stripPng(buf);
    return buf;
  }

  function stripJpeg(buf) {
    const out = [buf.slice(0, 2)]; // SOI
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xDA || marker === 0xD9) { out.push(buf.slice(i)); break; } // SOS/EOI 起保留到结尾
      if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (marker === 0xE1 || marker === 0xE2 || marker === 0xFE) {
        i += 2 + len; // 丢弃 EXIF/ICC/注释
      } else {
        out.push(buf.slice(i, i + 2 + len));
        i += 2 + len;
      }
    }
    return Buffer.concat(out);
  }

  function stripPng(buf) {
    const out = [buf.slice(0, 8)];
    let i = 8;
    while (i + 8 <= buf.length) {
      const len = buf.readUInt32BE(i);
      const type = buf.toString('ascii', i + 4, i + 8);
      if (type === 'IHDR' || type === 'PLTE' || type === 'IDAT' || type === 'IEND') {
        out.push(buf.slice(i, i + 12 + len));
      }
      i += 12 + len;
    }
    return Buffer.concat(out);
  }

  async function uploadFiles(files) {
    const urls = [];
    if (files && files.length) {
      for (const file of files) {
        let buf = Buffer.from(file.data, 'base64');
        buf = stripMetadata(buf);
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
      name: name || '匿名',
      projection_text: projection_text || '',
      projection_image_urls: projection_image_urls,
      home_text: home_text || '',
      home_image_urls: home_image_urls,
      comment: comment || '',
      mood: mood || ''
    })
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
