import React from "react";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { BuyTickets } from "./tabs/BuyTickets";
import { SecondaryMarketTickets } from "./tabs/SecondaryMarketTickets";
import { MyTickets } from "./tabs/MyTickets";

import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
} from "@chakra-ui/react";

// Attendee homepage that allows attendee to buy, sell, and use tickets
export class Attendee extends React.Component {  
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
          Primary Market
        </Tab>
        <Tab>
          Secondary Market
        </Tab>
        <Tab>
          My Tickets
        </Tab>
      </TabList>
      <TabPanels>
      <BuyTickets 
        state={this.props.state} 
        setState={this.props.setState} 
        dismissTransactionError={this.props.dismissTransactionError}
        eventCreator={this.props.eventCreator}
        updateBalance={this.props.updateBalance}
        getEventsData={this.props.getEventsData}
      />
      <SecondaryMarketTickets 
        state={this.props.state} 
        setState={this.props.setState} 
        dismissTransactionError={this.props.dismissTransactionError}
        eventCreator={this.props.eventCreator}
        updateBalance={this.props.updateBalance}
        getEventsData={this.props.getEventsData}
      />
      <MyTickets
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
