import React from 'react'
import styles from './Components.module.css';

const Header = (props:any) => {
  return (
    <div>
        <h1 className={styles.header}>{props.header}</h1>

    </div>
  )
}

export default Header