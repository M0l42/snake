import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {isMobile} from 'react-device-detect';

class SetInfo extends React.Component {
    render(){
        if (isMobile) {
            return(<div className="description">{window.flask_description}</div>);
        }
        return(<h2>{window.flask_description}</h2>);
    }
}

class Box extends React.Component {
    selectBox = () => {
        this.props.selectBox(this.props.row, this.props.col)
    };

    render() {
        return(
            <div
                className={this.props.boxClass}
                id={this.props.id}
                onClick={this.selectBox}
            />
        );
    }

}

class Grid extends React.Component {
    render() {
        const width = this.props.cols * 14;
        var rowsArr = [];

        var boxClass = "";
        for (var i = 0; i < this.props.rows; i++){
            for (var j = 0; j < this.props.cols; j++){
                let boxId = i + "_" + j;
                if(this.props.gridFull[i][j] == 1){
                  boxClass = "box snake"
                }
                else if(this.props.gridFull[i][j] == 2){
                  boxClass = "box apple"
                }
                else{
                  boxClass = "box off"
                }
                // boxClass = this.props.gridFull[i][j] ? "box snake" : "box off";
                rowsArr.push(
                    <Box
                        boxClass={boxClass}
                        key={boxId}
                        boxId={boxId}
                        row={i}
                        col={j}
                        selectBox={this.props.selectBox}
                    />
                );
            }
        }

        return (
            <div className="grid" style={{width: width}}>
                {rowsArr}
            </div>
        );
    }
}


class Main extends React.Component{
    constructor() {
        super();
        if (isMobile) {
            this.cols = 20;
            this.rows = 20;
        }
        else {
            this.cols = 30;
            this.rows = 30;
        }
        this.speed = 60;
        this.direction = -1;
        this.algorithm = "dijkstra";
        this.snake = [{
            "x": Math.floor(this.rows/2),
            "y": Math.floor(this.cols/2),
          }];
        this.apple = {
          "x": Math.floor(Math.random() * Math.floor(this.cols)),
          "y": Math.floor(Math.random() * Math.floor(this.rows)),
        };

        this.state = {
            list: [],
            error: null,
            win: "Snake is playing",
            generation: 0,
            gridFull: Array(this.rows).fill().map(() => Array(this.cols).fill(0) )
        };
        this.findPath()
    };

    buildList =(data)=>{
        this.state.list = [];
        this.setState({list: data.path, error: data.result});
        if(this.state.error == 'success'){
            this.direction = this.state.list[this.state.list.length - 1];
            this.state.list.pop();
        }
        else if(this.state.error != null){
            console.log(this.state.error);
            console.log(this.apple);
            this.setState({win: "Lost! Try again by Clearing the board !"});
            console.log(this.state.win)
        }
    };

    findPath =()=> {
        this.direction = -1;
        let data = {
            'snake': this.snake,
            'apple': this.apple,
            'algorithm': this.algorithm,
            'rows': this.rows,
            'cols': this.cols
        };
        fetch("/update/", {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(response => response.json())
            .then(this.buildList)
            .catch();
    };

    selectBox = (row, col) => {
        let gridCopy = arrayClone(this.state.gridFull);
        gridCopy[row][col] = !gridCopy[row][col];
        this.setState({
            gridFull: gridCopy
        })
    };

    playButton = () => {
      clearInterval(this.intervalId)
      this.intervalId = setInterval(this.play, this.speed);
    };

    pauseButton = () => {
      clearInterval(this.intervalId);
    };

    clearButton = () => {
        let grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0) );
        this.setState({
           gridFull: grid,
           generation: 0,
           win: "Snake is playing",
           list: [],
           error: null,
        });
        this.snake = [{
            "x": Math.floor(this.rows/2),
            "y": Math.floor(this.cols/2),
          }];
        this.apple = {
          "x": Math.floor(Math.random() * Math.floor(this.cols)),
          "y": Math.floor(Math.random() * Math.floor(this.rows)),
        };
        this.direction = -1;
        this.findPath()
    };

    dijkstraButton = () => {
      this.algorithm = "dijkstra";
    };

    aStarButton = () => {
      this.algorithm = "a_star";
    };

    play = () => {
      if(this.state.error == 'success' && this.direction >= 0){
          let g = this.state.gridFull;
          let g2 = arrayClone(this.state.gridFull);
          g2[this.apple.x][this.apple.y] = 2;
          let pos = this.snake[this.snake.length - 1];
          g2[pos.x][pos.y] = 1

          if(this.direction == 3){
              this.newHead_y = pos.y - 1;
              this.newHead_x = pos.x;
          }
          if(this.direction == 2){
              this.newHead_y = pos.y + 1;
              this.newHead_x = pos.x;
          }
          if(this.direction == 1){
              this.newHead_x = pos.x + 1;
              this.newHead_y = pos.y;
          }
          if(this.direction == 0){
              this.newHead_x = pos.x - 1;
              this.newHead_y = pos.y;
          }
          g2[this.newHead_x][this.newHead_y] = 1;
          this.snake.push({x:this.newHead_x, y:this.newHead_y})

          if(this.newHead_x != this.apple.x || this.newHead_y != this.apple.y){
              let oldTails = this.snake[0];
              g2[oldTails.x][oldTails.y] = 0;
              this.snake.shift();
              this.direction = this.state.list[this.state.list.length - 1];
              if(this.state.list.length != 1) this.state.list.pop();
          }
          else{
              let apple_is_safe = true;
              while(apple_is_safe){
                let apple_x = Math.floor(Math.random() * Math.floor(this.cols));
                let apple_y = Math.floor(Math.random() * Math.floor(this.rows));
                if( g2[apple_x][apple_y]==0 ){
                    apple_is_safe = false;
                    this.apple.x = apple_x;
                    this.apple.y = apple_y;
                }
              }
              this.findPath();
          }

          this.setState({
            gridFull: g2,
            generation: this.state.generation + 1
          });
      }
    };



    render() {
        return (
            <div>
                <h1>{window.flask_title}</h1>
                <SetInfo/>
                <div className="center my-4">
                    <div className="btn-group" role="group" aria-label="Basic example">
                        <button type="button" className="btn btn-primary" onClick={() => this.playButton()}>Play</button>
                        <button type="button" className="btn btn-primary" onClick={() => this.pauseButton()}>Stop</button>
                        <button type="button" className="btn btn-primary" onClick={() => this.clearButton()}>Clear</button>
                        <button type="button" className="btn btn-primary" onClick={() => this.dijkstraButton()}>Dijkstra</button>
                        <button type="button" className="btn btn-primary" onClick={() => this.aStarButton()}>A*</button>
                    </div>
                </div>
                <Grid
                    gridFull={this.state.gridFull}
                    rows={this.rows}
                    cols={this.cols}
                    selectBox={this.selectBox}
                />
                <h2 className="center my-4" >{this.state.win}</h2>
                <h2 className="center my-4" >Score {this.snake.length}</h2>
            </div>
        );
    }
}

function arrayClone(arr) {
    return JSON.parse(JSON.stringify(arr));
}

export default Main;
