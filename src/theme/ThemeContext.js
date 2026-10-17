import React from "react";

import { THEME } from "./palette.js";

export const ThemeCtx = React.createContext(THEME.light);

/* ---------------------------------------------------------
   Small UI atoms (theme aware)
--------------------------------------------------------- */
export function useT() { return React.useContext(ThemeCtx); }
