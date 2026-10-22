import { defineBoot } from '#q-app/wrappers';
import { appIcons } from '../icons';

export default defineBoot(({ app }) => {
  const $q = app.config.globalProperties.$q as {
    iconMapFn?: (iconName: string) => { icon: string } | undefined;
  };

  $q.iconMapFn = (iconName: string) => {
    const icon = appIcons[iconName];
    if (icon) {
      return { icon };
    }
  };
});
