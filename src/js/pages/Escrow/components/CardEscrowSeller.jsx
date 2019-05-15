/* global web3 */
import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, Button } from 'reactstrap';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleNotch, faCheck} from "@fortawesome/free-solid-svg-icons";
import { fromTokenDecimals, toTokenDecimals } from '../../../utils/numbers';

import RoundedIcon from "../../../ui/RoundedIcon";

import escrow from '../../../features/escrow';
import { States } from '../../../utils/transaction';
import ConfirmDialog from '../../../components/ConfirmDialog';

import one from "../../../../images/escrow/01.png";
import two from "../../../../images/escrow/02.png";
import three from "../../../../images/escrow/03.png";
import four from "../../../../images/escrow/04.png";
import Loading from "../../../components/Loading";

const Done = () => (
  <React.Fragment>
    <RoundedIcon icon={faCheck} bgColor="green"/>
    <h2 className="mt-4">Done.</h2>
    <p className="m-0 font-weight-bold">Trade complete. Funds are now in the buyer&apos;s wallet</p>
    <p className="m-0 text-muted">Thank you for using Status Teller Network</p>
  </React.Fragment>
);

class Funded extends Component {
  state = {
    displayDialog: false
  };

  displayDialog = show => () => {
    this.setState({displayDialog: show});
  };

  releaseEscrow = () => {
    this.props.releaseEscrow();
    this.displayDialog(false)();
  };

  render(){
    return <React.Fragment>
    <span className="bg-dark text-white p-3 rounded-circle">
      <img src={four} alt="four" />
    </span>
    <h2 className="mt-4">{this.props.trade.status === 'paid' ? <Fragment>Payment has been sent by the buyer.<br />Verify and release the funds</Fragment> : "Funds are in the escrow. Release them when you will get the payment." }</h2>
    <Button color="primary" className="btn-lg mt-3" onClick={this.displayDialog(true)}>Release funds</Button>
    <ConfirmDialog display={this.state.displayDialog} onConfirm={this.releaseEscrow} onCancel={this.displayDialog(false)} title="Release funds" content="Are you sure?" />
  </React.Fragment>;
  }
}

Funded.propTypes = {
  releaseEscrow: PropTypes.func,
  trade: PropTypes.object
};

const Funding = () => (
  <React.Fragment>
    <span className="bg-dark text-white p-3 rounded-circle">
      <img src={three} alt="three" />
    </span>
    <h2 className="mt-4">Waiting for the confirmations from the miners</h2>
    <FontAwesomeIcon icon={faCircleNotch} size="5x" spin/>
  </React.Fragment>
);


class PreFund extends Component {
  render(){
    const {fee, showApproveScreen, showFundButton, fundEscrow, trade, tokens} = this.props;
    const { toBN } = web3.utils;

    if (!trade.token || !trade.token.balance) {
      return <Loading page={true}/>; // Wait for trade to be populated
    }

    const enoughBalance = toBN(trade.token.balance ? toTokenDecimals(trade.token.balance, trade.token.decimals) : 0).gte(toBN(trade.tradeAmount)) &&
                          toBN(toTokenDecimals(tokens.SNT.balance, 18)).gte(toBN(fee));
    return <Fragment>
      <span className="bg-dark text-white p-3 rounded-circle">
        <img src={two} alt="two" />
      </span>
      <p className="h2 mt-4">{!showFundButton ? 'You are about to approve' : 'You are about to send'}</p>
      <p className="h2 text-success">{fromTokenDecimals(trade.tradeAmount, trade.token.decimals)} {trade.token.symbol}</p>
      { fee !== "0" && <Fragment>
      <p className="h2">+ our fee</p>
      <p className="h2 text-success">{fromTokenDecimals(fee, 18)} SNT</p>
      </Fragment> }
      { showFundButton && <Button color="primary" disabled={!enoughBalance} className="btn-lg mt-3" onClick={() => { fundEscrow(trade, fee); }}>Fund</Button> }
      { showFundButton && !enoughBalance && <p className="balanceAlert">Not enough balance</p>}
      { !showFundButton && <Button color="primary" className="btn-lg mt-3" onClick={showApproveScreen}>Approve Token Transfer(s)</Button> }
    </Fragment>;
  }
}

PreFund.propTypes = {
  trade: PropTypes.object,
  tokens: PropTypes.object,
  fee: PropTypes.string,
  showApproveScreen: PropTypes.func,
  showFundButton: PropTypes.bool,
  fundEscrow: PropTypes.func
};

const Start = ({onClick}) => (
  <React.Fragment>
    <span className="bg-dark text-white p-3 rounded-circle">
      <img src={one} alt="one" />
    </span>
    <h2 className="mt-4">Waiting for you to fund the escrow</h2>
    <p>Before accepting the payment you must put the assets into an escrow</p>
    <Button color="primary" className="btn-lg mt-3" onClick={onClick}>Start</Button>
  </React.Fragment>
);

Start.propTypes = {
  onClick: PropTypes.func
};

class CardEscrowSeller extends Component {

  state = {
    step: 1
  };

  componentDidMount(){
    this.determineStep(this.props.trade);
  }

  determineStep(trade){
    let step;

    switch(trade.status){
      case escrow.helpers.tradeStates.released:
        step = 5;
        break;
      case escrow.helpers.tradeStates.funded:
        step = 4;
        break;
      case escrow.helpers.tradeStates.paid: {
        step = 4;
        break;
      }
      case escrow.helpers.tradeStates.waiting:
      default:
        step = 1;
    }

    this.setState({step});
  }

  componentDidUpdate(prevProps) {
    if (this.props.trade.escrowId !== prevProps.trade.escrowId) {
      this.determineStep(this.props.trade);
    }
  }

  handleStepClick = () => {
    let step = this.state.step;
    step++;
    this.setState({step});
  };

  render(){
    let step = this.state.step;

    const {trade, fee, showApproveScreen, fundEscrow, releaseEscrow, fundStatus, releaseStatus, tokens} = this.props;
    let showFundButton = this.props.showFundButton;

    if(trade.status === escrow.helpers.tradeStates.released || trade.status === escrow.helpers.tradeStates.paid){
      showFundButton = false;
    }

    if(showFundButton) step = 2;
    if(fundStatus === States.pending || releaseStatus === States.pending) step = 3;
    if(fundStatus === States.success) step = 4;
    if(releaseStatus === States.success || trade.status === escrow.helpers.tradeStates.released) step = 5;

    let component;
    switch(step){
      case 5:
        component = <Done />;
        break;
      case 4:
        component = <Funded trade={trade} releaseEscrow={() => { releaseEscrow(trade.escrowId); }} />;
        break;
      case 3:
        component = <Funding />;
        break;
      case 2:
        component = <PreFund tokens={tokens} showFundButton={showFundButton} fundEscrow={fundEscrow} trade={trade} fee={fee} showApproveScreen={showApproveScreen} />;
        break;
      case 1:
      default:
        component = <Start onClick={this.handleStepClick} />;
    }


    return <Card>
    <CardBody className="text-center p-5">
      {component}
    </CardBody>
  </Card>;
  }
}

CardEscrowSeller.propTypes = {
  tokens: PropTypes.object,
  trade: PropTypes.object,
  fee: PropTypes.string,
  showApproveScreen: PropTypes.func,
  fundEscrow: PropTypes.func,
  showFundButton: PropTypes.bool,
  releaseEscrow: PropTypes.func,
  fundStatus: PropTypes.string,
  releaseStatus: PropTypes.string
};

export default CardEscrowSeller;
