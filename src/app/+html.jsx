import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#3D6246" />
        <meta
          name="description"
          content="A fresher pantry. A little less waste. ShelfLife helps you enjoy every ingredient."
        />
        <ScrollViewStyleReset />
        <style>
          {
            'body{background:#F8F9F4}input,button{font:inherit}*{box-sizing:border-box} :focus-visible{outline:2px solid #789B4A;outline-offset:3px} ::selection{background:#D3E5A6}'
          }
        </style>
      </head>
      <body>{children}</body>
    </html>
  );
}
