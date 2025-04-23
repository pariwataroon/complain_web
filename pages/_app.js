import dayjs from "dayjs";
import "dayjs/locale/th";
import { useEffect } from "react";
import { LoadingProvider } from "@context/LoadingProvider";
import { StoreProvider } from "@context/StoreProvider";

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  useEffect(() => {
    dayjs.locale(process.env.NEXT_PUBLIC_LOCALE || "th");
  }, []);
  return (
    <LoadingProvider>
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
