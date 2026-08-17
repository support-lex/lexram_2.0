'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredData, STORAGE_KEYS } from '@/lib/storage';

interface MatterContextType {
    selectedMatterId: string;
    setSelectedMatterId: (id: string) => void;
    matters: any[];
}

const MatterContext = createContext<MatterContextType>({
    selectedMatterId: 'all',
    setSelectedMatterId: () => { },
    matters: [],
});

export function MatterProvider({ children }: { children: ReactNode }) {
    const [selectedMatterId, setSelectedMatterId] = useState<string>('all');
    const [matters, setMatters] = useState<any[]>([]);

    useEffect(() => {
        setMatters(getStoredData<any[]>(STORAGE_KEYS.MATTERS, []));
    }, []);

    return (
        <MatterContext.Provider value={{ selectedMatterId, setSelectedMatterId, matters }}>
            {children}
        </MatterContext.Provider>
    );
}

export function useMatterContext() {
    return useContext(MatterContext);
}
