import React from "react";
import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";
import { blue, indigo } from "@material-ui/core/colors";
import { CssBaseline } from "@material-ui/core";
import AppRouters from "./AppRouters";

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: blue[900]
    },
    primary: {
      main: indigo[700]
    }
  },
  overrides: { drawerWidth: 240, heightOffset: 60 }
});

const App = props => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouters />
    </ThemeProvider>
  );
};

export default App;
