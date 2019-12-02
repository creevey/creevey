import * as React from "react";
import { Spinner } from "@skbkontur/react-ui/components";
import Logotype from "@skbkontur/react-ui/Logotype";
import Button from "@skbkontur/react-ui/Button";
import ThemeProvider from "@skbkontur/react-ui/ThemeProvider";
import FLAT_THEME from "@skbkontur/react-ui/lib/theming/themes/FlatTheme";
import Input from "@skbkontur/react-ui/Input";

interface SideBarHeaderProps {
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
    onFilterChange: (value: string) => void;
}

export class SideBarHeader extends React.Component<SideBarHeaderProps> {
    public render(): React.ReactNode {
        return (
            <>
                <div>
                <Logotype locale={{ prefix: "c", suffix: "lin" }} suffix="creevey" />
                <ThemeProvider value={FLAT_THEME}>
                    {this.props.isRunning ? (
                        <Button onClick={this.props.onStop}>
                            <Spinner type="mini" caption="Running" />
                        </Button>
                    ) : (
                        <Button onClick={this.props.onStart}>Start</Button>
                    )}
                </ThemeProvider>
                </div>
                <Input onChange={(_, value) => this.props.onFilterChange(value)} />
            </>
        );
    }
}