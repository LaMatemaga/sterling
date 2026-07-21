import type { ReactNode } from "react";
import type { SterlingLocale } from "./types";

/** Writing conventions around a figure, kept separate from every chart primitive. */
export interface SterlingEditorial {
  /** Use `false` to remove the QED-like title mark, or supply another mark. */
  titleMark?: ReactNode | false;
  /** Optional destination for an interactive title mark. */
  titleMarkHref?: string;
  /** Accessible label for an interactive title mark. */
  titleMarkLabel?: string;
  /** Use `false` to omit the credit from the caption. */
  signature?: ReactNode | false;
  /** Replaces the localized Source/Fuente label. */
  sourceLabel?: ReactNode;
}

export interface SterlingCreditOptions {
  author?: ReactNode;
  productName?: ReactNode;
  /** Link the product name to its public documentation. Defaults to true. */
  linkToSterling?: boolean;
  sterlingUrl?: string;
}

/** A portable credit, e.g. “Made by Ada with Sterling ✦”. */
export function sterlingCredit(
  {
    author,
    productName = "Sterling",
    linkToSterling = true,
    sterlingUrl = "https://www.lamatemaga.com/sterling",
  }: SterlingCreditOptions,
  locale: SterlingLocale = "en",
): ReactNode {
  const product = linkToSterling
    ? <a className="sterling-figure__credit-link" href={sterlingUrl}>{productName} ✦</a>
    : <>{productName} ✦</>;

  if (locale === "es") {
    return author ? <>Hecho por {author} con {product}</> : <>Hecho con {product}</>;
  }

  return author ? <>Made by {author} with {product}</> : <>Made with {product}</>;
}
