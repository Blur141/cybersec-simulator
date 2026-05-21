import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Interactive Cybersecurity Attack Simulator" />
        <meta name="theme-color" content="#000510" />
        <style>{`
          @font-face {
            font-family: 'CyberMono';
            src: local('Courier New'), local('Courier');
            font-weight: normal;
          }
          * { box-sizing: border-box; }
          body { background: #000510; overflow: hidden; }
          ::selection { background: rgba(0,240,255,0.2); color: #00f0ff; }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
