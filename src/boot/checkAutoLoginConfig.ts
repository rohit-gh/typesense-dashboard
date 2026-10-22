import { defineBoot } from '#q-app/wrappers';
import axios from 'axios';
import { Platform } from 'quasar';
import { getDevNodeLogin } from 'src/shared/devNodeLogin';
import { useNodeStore } from 'src/stores/node';
import type { NodeLoginDataInterface } from 'src/stores/node';

function loginFromDevEnv(store = useNodeStore()) {
  const devLogin = getDevNodeLogin();
  if (devLogin) {
    store.login(devLogin);
  }
}

export default defineBoot(({ store }) => {
  if (Platform.is.electron) {
    loginFromDevEnv(useNodeStore(store));
    return;
  }
  void axios
    .get('config.json')
    .then((response) => {
      const nodeStore = useNodeStore(store);
      if (response.data && response.data.apiKey) {
        nodeStore.login(response.data);
      } else {
        loginFromDevEnv(nodeStore);
      }
      if (response.data && response.data.history) {
        response.data.history.forEach((historyItem: NodeLoginDataInterface) => {
          const historyJson = JSON.stringify(historyItem);
          if (!nodeStore.loginHistory.includes(historyJson)) {
            nodeStore.loginHistory.push(historyJson);
          }
        });
      }
      if (response.data && response.data.ui) {
        nodeStore.setUIConfig(response.data.ui);
      }
    })
    .catch(() => {
      loginFromDevEnv(useNodeStore(store));
    });
});
