import { BigNumberish, utils } from 'ethers';
import { AddressLike, Contract, Send, SignerWithAddress } from '@crestproject/crestproject';
import { ComptrollerLib } from '@melonproject/protocol';

// prettier-ignore
export interface DenominationAssetInterface extends Contract<any> {
  approve: Send<(spender: AddressLike, amount: BigNumberish) => boolean, any>;
}

export interface BuySharesParams {
  comptrollerProxy: ComptrollerLib;
  signer: SignerWithAddress;
  buyer: AddressLike;
  denominationAsset: DenominationAssetInterface;
  investmentAmount?: BigNumberish;
  minSharesAmount?: BigNumberish;
}

export interface RedeemSharesParams {
  comptrollerProxy: ComptrollerLib;
  signer: SignerWithAddress;
  quantity?: BigNumberish;
  additionalAssets?: AddressLike[];
  assetsToSkip?: AddressLike[];
}

export async function buyShares({
  comptrollerProxy,
  signer,
  buyer,
  denominationAsset,
  investmentAmount = utils.parseEther('1'),
  minSharesAmount = investmentAmount,
}: BuySharesParams) {
  const callerDenominationAsset = denominationAsset.connect(signer);
  await callerDenominationAsset.approve(comptrollerProxy, investmentAmount);

  const callerComptrollerProxy = comptrollerProxy.connect(signer);
  return callerComptrollerProxy.buyShares(buyer, investmentAmount, minSharesAmount);
}

export async function redeemShares({
  comptrollerProxy,
  signer,
  quantity,
  additionalAssets = [],
  assetsToSkip = [],
}: RedeemSharesParams) {
  if (quantity == undefined) {
    if (additionalAssets.length > 0 || assetsToSkip.length > 0) {
      throw 'Must specify shares quantity if specifying additional assets or assets to skip';
    }
    return comptrollerProxy.connect(signer).redeemShares();
  } else {
    return comptrollerProxy.connect(signer).redeemSharesDetailed(quantity, additionalAssets, assetsToSkip);
  }
}
