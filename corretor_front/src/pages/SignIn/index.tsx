import { GoogleLogo } from 'phosphor-react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import './styles.scss'
import { auth } from '../../services/firebase'
import { useState } from 'react'

import type { User } from 'firebase/auth'; //this is a type that must be used!

export function SignIn() {
	const [user, setUser] = useState<User | null>();//need to create a user start to be usable to store the user for that why th etyoe thre User
	const handleGoogleSign = async () => {
		const provider = new GoogleAuthProvider()
		try {
			const result = await signInWithPopup(auth, provider)
			setUser(result.user);
		} catch (err) {
			console.error("Error signing in with google", err);
		};

	};


	return (
		<div className="container">
			<div className="user">
				{user?.displayName && (
					<>
						<h1>Bem vindo!</h1>
						<div>
							<strong>Nome: {user.displayName}</strong>
						</div>
						<div>
							<strong>E-mail:</strong> <small>{user.email}</small>
						</div>
					</>
				)}
			</div>

			<h1>Acesse sua conta</h1>
			<span>
				Faca seu login <br /> 
			</span>

			<button className="button" onClick={handleGoogleSign}>
				<GoogleLogo />
				Entrar com o Google
			</button>
		</div>
	);
}
