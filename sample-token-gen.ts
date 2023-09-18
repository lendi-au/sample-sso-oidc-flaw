import { ListAccountRolesCommand, ListAccountsCommand, SSOClient } from '@aws-sdk/client-sso';
import {
  SSOOIDCClient,
  StartDeviceAuthorizationCommand,
  CreateTokenCommand,
  RegisterClientCommand,
} from '@aws-sdk/client-sso-oidc';

import { addSeconds, formatISO } from 'date-fns';
import { writeFile, writeFileSync } from 'fs';

import { hostname } from 'os';

const region = process.env.AWS_REGION ?? 'ap-southeast-2';
const clientName = `sso-test-${hostname()}`
const startUrl = process.env.START_URL; // set this via environment to what you need it to be.
const oidc = new SSOOIDCClient({ region });
const rcc = new RegisterClientCommand({
  clientName,
  clientType: 'public',
});


// async block which represent the main code execution
(async () => {
  const { clientId, clientSecret } = await oidc.send(rcc);
  
  const sdac = new StartDeviceAuthorizationCommand({
    clientId,
    clientSecret,
    startUrl,
  });

  const { verificationUriComplete, deviceCode, interval } = await oidc.send(sdac);
  if (!verificationUriComplete) {
    throw Error('No authz URL to open - exiting...');
  }

  console.log(verificationUriComplete);

  const ctc = new CreateTokenCommand({
    clientId,
    clientSecret,
    deviceCode,
    grantType: 'urn:ietf:params:oauth:grant-type:device_code',
  });

  while (true) {
    try {
      const rawToken = await oidc.send(ctc);
      const { accessToken, expiresIn } = rawToken;
      const tokenData = {
        accessToken,
        expires: formatISO(addSeconds(new Date(), expiresIn as number)),
      };
      writeFileSync(`token.json`, JSON.stringify(tokenData), 'utf-8');

      // you can also list accounts for a user!
      const accounts = new ListAccountsCommand({accessToken});
      const sso = new SSOClient({ region });
      const accountList = await sso.send(accounts);
      console.log(accountList.accountList)

      // take first account and list the roles in it as an example...
      const roles = new ListAccountRolesCommand({accessToken, accountId: accountList.accountList?.[0].accountId})
      const roleList = await sso.send(roles);
      console.log(roleList.roleList);
      return true;
    } catch (error: any) {
      if (error.error === 'authorization_pending') {
        await new Promise((resolve) => setTimeout(resolve, (interval || 1) * 1000));
        continue;
      } else {
        console.log(error)
        throw error;
      }
    }
  }

})();