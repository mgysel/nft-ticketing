import React from "react";
import { NetworkErrorMessage } from "./NetworkErrorMessage";
import {
  Box,
  Text,
} from "@chakra-ui/react";

export class EmptyMessage extends React.Component {  

  constructor(props) {
    super(props);
    this.state = {
      message: this.props.message.split('\n'),
    }
  }

  render() {
    return (
      <Box className="container"       
        mt="20px"
        p="20px"
        width="80%"
        variant="soft-rounded"
        colorScheme="green"
        borderRadius="5px"
        border="1px solid"
        borderColor="gray.200"
      >
        {this.state.message.map((line, index) => (
          <Text key={index} m={0} p='3px'>{line}</Text>
        ))}
      </Box>
    )
  }
}