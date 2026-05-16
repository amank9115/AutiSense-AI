import type { AppProps } from 'next/app';
import { ScreeningProvider } from '../context/ScreeningContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ScreeningProvider>
      <Component {...pageProps} />
    </ScreeningProvider>
  );
}