import { LoadingProvider } from "@context/LoadingProvider";
import { StoreProvider } from "@context/StoreProvider";

function MyApp({ Component, pageProps }) {
  return (
    <LoadingProvider>
      <StoreProvider>
        <Component {...pageProps} />
      </StoreProvider>
    </LoadingProvider>
  );
}

export default MyApp;
