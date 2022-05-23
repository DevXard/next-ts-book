import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const filecache = localforage.createInstance({
  name: 'filecache',
});

(async () => {
  await filecache.setItem('color', 'red');
  const color = await filecache.getItem('color');
  console.log(color);
})();
 
export const unpkgPathPlugin = (inputCode: string) => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // resolve root index.js
      build.onResolve({ filter: /(^index\.js$)/}, () => {
        return {
          path: 'index.js',
          namespace: 'a',
        }
      }) 
      // handle relave path in module
      build.onResolve({ filter: /^\.+\//}, (args: any) => {
        return {
          namespace: 'a',
          path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
      }
      })
      // handle main file in module
      build.onResolve({ filter: /.*/ }, async (args: any) => {

        return {
            namespace: 'a',
            path: `https://unpkg.com/${args.path}`,
        }

      });
 
      build.onLoad({ filter: /.*/ }, async (args: any): Promise<esbuild.OnLoadResult> => {
 
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode, 
          };
        } 

        const cachedresult = await filecache.getItem<esbuild.OnLoadResult>(args.path);

        if (cachedresult) {
          return cachedresult;
        }

        const { data, request } = await axios.get(args.path);

        console.log(new URL('./', request.responseURL).pathname)
        
        const result: esbuild.OnLoadResult = {
            loader: 'jsx',
            contents: data,
            resolveDir: new URL('./', request.responseURL).pathname,
          };

        await filecache.setItem(args.path, result);

        return result;
      });
    },
  };
};