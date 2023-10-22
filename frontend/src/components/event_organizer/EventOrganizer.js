import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import EventArtifact from "../../contracts/Event.json";
import EventCreatorArtifact from "../../contracts/EventCreator.json";
import contractAddress from "../../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { CreateEvent } from "./tabs/CreateEvent";
import { MyEvents } from "./tabs/MyEvents";

import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
} from "@chakra-ui/react";

export class EventOrganizer extends React.Component {  
  constructor(props) {
    super(props);
    
    this.props.updateBalance();
    this.props.getEventsData();
  }

  // If everything is loaded, we render the application.
  render() {
  return (
    <Tabs 
      mt="60px"
      p="20px"
      variant="soft-rounded"
      colorScheme="green"
      borderRadius="5px"
      border="1px solid"
      borderColor="gray.200"
    >
    <TabList>
        <Tab>
          Create Events
        </Tab>
        <Tab>
          My Events
        </Tab>
      </TabList>
      <TabPanels>
      <CreateEvent 
        state={this.props.state} 
        setState={this.props.setState} 
        dismissTransactionError={this.props.dismissTransactionError}
        eventCreator={this.props.eventCreator}
        updateBalance={this.props.updateBalance}
        getEventsData={this.props.getEventsData}
      />
      <MyEvents 
        state={this.props.state} 
        setState={this.props.setState} 
        dismissTransactionError={this.props.dismissTransactionError}
        eventCreator={this.props.eventCreator}
        updateBalance={this.props.updateBalance}
        getEventsData={this.props.getEventsData}
      />
    </TabPanels>
  </Tabs>
  )}
}
