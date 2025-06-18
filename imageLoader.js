export default function imageLoader({ src, width, quality }) {
  if (src.startsWith("http") || src.startsWith("//")) {
    return src;
  }
  return src;
}
