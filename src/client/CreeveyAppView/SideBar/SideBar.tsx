import * as React from "react";
import {css} from "@emotion/core";
import {ScrollContainer} from "@skbkontur/react-ui/components";
import {SideBarHeader} from "./SideBarHeader";

interface SideBarProps {
    isRunning: boolean;
    children: React.ReactNode;
    onStart: () => void;
    onStop: () => void;
    onFilterChange: (value: string) => void;
}

export class SideBar extends React.Component<SideBarProps> {
    public render(): React.ReactNode {
        const headerHeight = "90px";

        return (
            <div css={css`
                        width: 350px;
                        height: 100vh;
                        box-shadow: 0 0 5px #AAA;
                    `}>
                <div css={css`height: ${headerHeight}`}>
                    <SideBarHeader
                        isRunning={this.props.isRunning}
                        onStart={this.props.onStart}
                        onStop={this.props.onStop}
                        onFilterChange={this.props.onFilterChange}
                    />
                </div>
                <div css={css`height: calc(100vh - ${headerHeight})`}>
                    <ScrollContainer>
                        {this.props.children}
                    </ScrollContainer>
                </div>
            </div>
        )
    }
}