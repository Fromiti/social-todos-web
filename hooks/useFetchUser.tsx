import { useEffect, useState } from 'react';
import {
	ApolloClient,
	ApolloQueryResult,
	useApolloClient,
} from '@apollo/client';
import { MeDocument, MeQuery } from '../__generated__/GraphQLTypes';
import { useRouter } from 'next/router';

declare global {
	interface Window {
		__user: MeQuery;
	}
}

export async function fetchUser(
	client: ApolloClient<object>
): Promise<MeQuery> {
	if (typeof window !== 'undefined' && window.__user) {
		return window.__user;
	}

	const { data }: ApolloQueryResult<MeQuery> = await client.query({
		query: MeDocument,
	});

	if (!data.me) {
		delete window.__user;
		return null;
	}

	if (typeof window !== 'undefined') {
		window.__user = data;
	}

	return data;
}

interface FetchUserProps {
	required?: boolean;
}

export function useFetchUser({ required }: FetchUserProps) {
	const [loading, setLoading] = useState<boolean>(
		() => !(typeof window !== 'undefined' && window.__user)
	);
	const { replace } = useRouter();
	const apolloClient = useApolloClient();

	const [user, setUser] = useState<MeQuery | null>(() => {
		if (typeof window === 'undefined') {
			return null;
		}
		return window.__user || null;
	});

	useEffect(() => {
		if (!loading && user) {
			return;
		}
		setLoading(true);
		let isMounted = true;

		fetchUser(apolloClient).then(user => {
			// Only set the user if the component is still mounted
			if (isMounted) {
				// When the user is not logged in but login is required
				if (required && !user) {
					replace('/auth');
					return;
				}
				setUser(user);
				setLoading(false);
			}
		});

		return () => {
			isMounted = false;
		};
	}, []);

	return { user, loading };
}
