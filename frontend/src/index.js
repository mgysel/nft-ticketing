import React from "react";
import ReactDOM from "react-dom/client";
import { Dapp } from "./components/Dapp";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// We import bootstrap here, but you can remove if you want
import "bootstrap/dist/css/bootstrap.css";

// This is the entry point of your application, but it just renders the Dapp
// react component. All of the logic is contained in it.

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ChakraProvider>
      <Router>
        <Dapp />
      </Router>
    </ChakraProvider>
  </React.StrictMode>
);
