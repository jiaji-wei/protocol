import { getPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';

import { initTestEnvironment } from '~/utils/environment';
import { deploySystem, Address } from '~/utils';
import {
  createComponents,
  continueCreation,
  setupFund,
} from '~/contracts/factory';
import { getSettings } from '~/contracts/fund/hub';
import { register, PolicedMethods } from '~/contracts/fund/policies';
import { update } from '~/contracts/prices';
import { approve } from '~/contracts/dependencies/token';
import { requestInvestment } from '~/contracts/fund/participation';

const shared: any = {};

beforeAll(async () => {
  shared.environment = await initTestEnvironment();
  shared.accounts = await shared.environment.eth.getAccounts();
});

const randomString = (length = 4) =>
  Math.random()
    .toString(36)
    .substr(2, length);

test(
  'Happy path',
  async () => {
    const fundName = `test-fund-${randomString()}`;
    const deployment = await deploySystem();
    const {
      exchangeConfigs,
      fundFactory,
      priceSource,
      tokens,
      policies,
    } = deployment;
    const [quoteToken, baseToken] = tokens;

    const defaultTokens = [quoteToken, baseToken];

    await createComponents(fundFactory, {
      defaultTokens,
      exchangeConfigs,
      fundName,
      priceSource,
      quoteToken,
    });

    await continueCreation(fundFactory);
    const hubAddress = await setupFund(fundFactory);

    const settings = await getSettings(hubAddress);
    await register(settings.policyManagerAddress, {
      method: PolicedMethods.makeOrder,
      policy: policies.priceTolerance,
    });
    await register(settings.policyManagerAddress, {
      method: PolicedMethods.takeOrder,
      policy: policies.priceTolerance,
    });
    await register(settings.policyManagerAddress, {
      method: PolicedMethods.executeRequest,
      policy: policies.whitelist,
    });

    const newPrice = getPrice(
      createQuantity(baseToken, 1),
      createQuantity(quoteToken, 0.34),
    );

    await update(priceSource, [newPrice]);

    // await approve({
    //   howMuch: createQuantity(quoteToken, 1),
    //   spender: new Address(shared.accounts[1]),
    // });

    const request = await requestInvestment(settings.participationAddress, {
      investmentAmount: createQuantity(quoteToken, 1),
    });

    console.log(request);
  },
  30 * 1000,
);
