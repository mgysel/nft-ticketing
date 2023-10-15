import React from "react";

import {
  Box,
  Center,
  Heading,
  HStack,
  Link,
  Popover,
  PopoverTrigger,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useHistory, useLocation } from 'react-router-dom';

export class Navbar extends React.Component {  

  // If everything is loaded, we render the application.
  render() {
  return (
    <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
      <VStack m={0} p={0} ml={5} spacing={0} alignItems="left">
        <Heading fontSize='3xl' color="white" p={0} m={0}>
          TicketChain
        </Heading>
        <Text fontSize='sm' color="white" p={0} m={0} ml={1} mb={1} >
          Balance: {(Number(this.props.state.balance).toFixed(1)).toString()} ETH
        </Text>
      </VStack>
      <Stack direction={'row'} spacing={0} mr='10px'>
        <Center>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={RouterLink}
                to={'/'}
                fontSize={'md'}
                fontWeight={500}
                color={'white'}
                _hover={{
                  textDecoration: 'none',
                  color: this.props.state.navLinkHoverColor,
                }}
                >
                Attendees
              </Link>
            </PopoverTrigger>
          </Popover>
        </Center>
        <Center>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={RouterLink}
                to={'/event-organizers'}
                fontSize={'md'}
                fontWeight={500}
                color={'white'}
                _hover={{
                  textDecoration: 'none',
                  color: this.props.state.navLinkHoverColor,
                }}>
                Event Organizers
              </Link>
            </PopoverTrigger>
          </Popover>
        </Center>
        <Center>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={RouterLink}
                to={'/balance'}
                fontSize={'md'}
                fontWeight={500}
                color={'white'}
                _hover={{
                  textDecoration: 'none',
                  color: this.props.state.navLinkHoverColor,
                }}>
                Balance
              </Link>
            </PopoverTrigger>
          </Popover>
        </Center>
      </Stack>
    </nav>
  )}
}
