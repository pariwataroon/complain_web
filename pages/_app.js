import { LoadingProvider } from "@context/LoadingProvider";
import { StoreProvider } from "@context/StoreProvider";

function MyApp({ Component, pageProps }) {
  return (
    <LoadingProvider>
      <StoreProvider>
        <Component {...pageProps} />
        <style jsx global>{`
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
        `}</style>
      </StoreProvider>
    </LoadingProvider>
  );
}

export default MyApp;
