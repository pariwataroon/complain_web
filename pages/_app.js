import Head from "next/head";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { LoadingProvider } from "@context/LoadingProvider";
import { StoreProvider } from "@context/StoreProvider";

dayjs.locale(process.env.NEXT_PUBLIC_LOCALE || "th");

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <LoadingProvider>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_NAME}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <StoreProvider>
        {getLayout(<Component {...pageProps} />)}
        <style jsx global>{`
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: "Sarabun", sans-serif;
          }
        `}</style>
      </StoreProvider>
    </LoadingProvider>
  );
}

export default MyApp;
