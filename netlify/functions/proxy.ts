// proxy.js
const express = require('express');
const fetch = require('node-fetch');

const pickHeaders = (headers, keys) => {
  const picked = {};
  keys.forEach(key => {
    if (headers[key]) {
      picked[key] = headers[key];
    }
  });
  return picked;
};

const app = express();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options('*', (req, res) => {
  res.set(CORS_HEADERS).status(204).send('');
});

app.all('*', async (req, res) => {
  const { method, headers, body, originalUrl } = req;

  if (originalUrl === '/') {
    const blankHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Google PaLM API proxy on webapp.io</title>
      </head>
      <body>
        <h1>Google PaLM API proxy on webapp.io</h1>
        <p>Tips: This project uses a reverse proxy to solve problems such as location restrictions in Google APIs.</p>
        <p>If you have any of the following requirements, you may need the support of this project.</p>
        <ol>
          <li>When you see the error message "User location is not supported for the API use" when calling the Google PaLM API</li>
          <li>You want to customize the Google PaLM API</li>
        </ol>
        <p>For technical discussions, please visit <a href="https://simonmy.com/posts/使用netlify反向代理google-palm-api.html">https://simonmy.com/posts/使用netlify反向代理google-palm-api.html</a></p>
      </body>
      </html>
    `;
    return res.set({ ...CORS_HEADERS, "Content-Type": "text/html" }).send(blankHtml);
  }

  const url = new URL(originalUrl, 'https://generativelanguage.googleapis.com');
  const proxyHeaders = pickHeaders(headers, ['content-type', 'x-goog-api-client', 'x-goog-api-key', 'accept-encoding']);

  try {
    const proxyRes = await fetch(url, {
      body,
      method,
      headers: proxyHeaders,
    });

    const proxyHeaders = {
      ...CORS_HEADERS,
      ...Object.fromEntries(proxyRes.headers.entries()),
    };

    delete proxyHeaders['content-encoding'];

    proxyRes.body.pipe(res.set(proxyHeaders).status(proxyRes.status));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
