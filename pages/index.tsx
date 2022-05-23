import type { NextPage } from 'next'
import * as esbuild from 'esbuild-wasm';
import styles from '../styles/Home.module.css'
import { useState, useRef, useEffect } from 'react'
import { unpkgPathPlugin } from '../plugins/unpackage-path-plugin'

const Home: NextPage = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');

  const startService = async () => {
    
    esbuild.initialize({
      worker: true,
      wasmURL: './esbuild.wasm',
    }).then((e) => {
      ref.current = esbuild
    })
    
  };

  useEffect(() => {
    
    startService();
  }, []);

  const onClick = async () => {
    console.log(ref)
    if (!ref.current) {
      return;
    }

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    console.log(result);

    setCode(result.outputFiles[0].text);

  };
  
  return (
    <div className={styles.container}>
      <textarea value={input} onChange={(e) => setInput(e.target.value)}>

      </textarea>
      <div>
        <button onClick={onClick}>Submint</button>
      </div>
      <pre>{code}</pre>
    </div>
  )
}

export default Home
