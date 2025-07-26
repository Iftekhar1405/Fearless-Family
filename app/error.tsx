'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center text-center bg-red-50">
            <div>
                <h1 className="text-4xl font-bold text-red-600">Something went wrong!</h1>
                <button
                    onClick={() => reset()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
