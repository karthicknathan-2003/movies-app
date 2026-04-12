import { useEffect } from "react";
import { useServerDownStatus } from "./components/context/ServerDownContext";
import { serverStatusRef } from "./utils/statusRef";

export default function ServerStatusBridge() {
    const { setErrorState } = useServerDownStatus();

    useEffect(() => {
        serverStatusRef.setErrorState = setErrorState;
    }, [setErrorState]);

    return null;
}