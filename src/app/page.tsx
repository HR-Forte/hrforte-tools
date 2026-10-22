import { redirect } from 'next/navigation';

// The root has no content of its own; redirect on the server instead of loading a splash screen.
export default function App() {
  redirect('/dashboard');
}
