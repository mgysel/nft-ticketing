import React from "react";
import {
  Box,
} from "@chakra-ui/react";

export function NoWalletDetected() {
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
          <div className="col-6 p-4 text-center">
            <p>
              No Ethereum wallet was detected. <br />
              Please install{" "}
              <a href="http://metamask.io" target="_blank" rel="noopener noreferrer">
                MetaMask
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </Box>
  );
}
