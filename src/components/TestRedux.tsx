'use client';

import type { RootState } from "@/store/store";
import { useSelector, useDispatch } from "react-redux";
import { increment, decrement, reset } from "@/store/features/CounterSlice";

const TestRedux = () => {
    const count = useSelector((state: RootState) => state.counter.value);
    const dispatch = useDispatch();

    return (
        <div>
            <h1>Hello, world!</h1>
            <p>Current count: {count}</p>
            <button onClick={() => dispatch(increment())}>Increment</button>
            <button onClick={() => dispatch(decrement())}>Decrement</button>
            <button onClick={() => dispatch(reset())}>Reset</button>
        </div>
    );
};

export default TestRedux;
