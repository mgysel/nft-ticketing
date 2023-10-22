import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";
import {
  Box,
} from "@chakra-ui/react";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <Box
      mt="60px"
      p="20px"
      variant="soft-rounded"
      colorScheme="green"
      borderRadius="5px"
      border="1px solid"
      borderColor="gray.200"
    >
      <div className="container">
        <div className="row justify-content-md-center">
          <div className="col-12 text-center">
            {/* Wallet network should be set to Localhost:8545. */}
            {networkError && (
              <NetworkErrorMessage 
                message={networkError} 
                dismiss={dismiss} 
              />
            )}
          </div>
          <div className="col-6 p-4 text-center">
            <p>Please connect to your wallet.</p>
            <button
              className="btn btn-warning"
              type="button"
              onClick={connectWallet}
            >
              Connect Metamask to Sepolia Network
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
}
