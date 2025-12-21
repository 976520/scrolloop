import express, { type Express, type Request, type Response } from "express";
import { renderToString } from "react-dom/server";
import React from "react";
import { InfiniteList } from "../../components/InfiniteList";
import type { PageResponse } from "../../types";
import type { CSSProperties } from "react";
import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = Number(process.env.PORT) || 3001;

interface TestItem {
  id: number;
  name: string;
}

let clientBundle = "";
try {
  const result = esbuild.buildSync({
    entryPoints: [path.resolve(__dirname, "./client.tsx")],
    bundle: true,
    write: false,
    format: "esm",
    target: "es2020",
    platform: "browser",
    define: {
      "process.env.NODE_ENV": '"development"',
    },
  });
  clientBundle = result.outputFiles[0].text;
} catch (e) {
  console.error("Failed to bundle client code:", e);
}

app.get("/bundle.js", (_req, res) => {
  res.header("Content-Type", "application/javascript");
  res.send(clientBundle);
});

app.get("/", async (_req: Request, res: Response) => {
  const initialData: TestItem[] = Array(50)
    .fill(0)
    .map((_, i) => ({ id: i, name: `Item ${i}` }));

  const fetchPage = async (
    page: number,
    size: number
  ): Promise<PageResponse<TestItem>> => {
    const start = page * size;
    const end = start + size;
    return {
      items: initialData.slice(start, end),
      total: initialData.length,
      hasMore: end < initialData.length,
    };
  };

  const html = renderToString(
    React.createElement(InfiniteList<TestItem>, {
      fetchPage,
      renderItem: (
        item: TestItem | undefined,
        index: number,
        style: CSSProperties
      ) =>
        React.createElement(
          "div",
          {
            "data-testid": `item-${index}`,
            "data-ssr-item": true,
            style,
          },
          item ? item.name : "Loading..."
        ),
      itemSize: 50,
      height: 400,
      pageSize: 20,
      isServerSide: true,
      initialData,
      initialTotal: initialData.length,
    })
  );

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR Test</title>
        <style>
          body { margin: 0; padding: 20px; font-family: sans-serif; }
        </style>
      </head>
      <body>
        <div id="root">${html}</div>
        <script type="module" src="/bundle.js"></script>
      </body>
    </html>
  `);
});

export function startServer(): Promise<{ server: any; port: number }> {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`test server running on http://localhost:${PORT}`);
      resolve({ server, port: PORT });
    });
  });
}

if (process.argv[1]?.endsWith("server.ts")) {
  startServer().catch(console.error);
}
