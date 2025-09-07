// This file exists solely to help TypeScript recognize JSX in isolated component tests if needed.
import 'react';
declare module 'react' {
  interface Attributes {
    // Allow data-testid and other testing attributes without TS complaining
    [key: `data-${string}`]: unknown;
  }
}
