"use strict"
let PanelContext=React.createContext(currentuser);
class Toppanelreact extends React.Component{
    constructor(props){
        super(props);
        this.state={

        };
    }
    componentDidMount() {

    }
    render(){

        return(
            <div id="toppanelreact">
                <PanelContext.Provider value={window.currentuser}>
                    <PanelContext.Consumer>
                        { context=><Sliceofinfo imgname='levelicon' val={context.level} text='Уровень'/>}
                    </PanelContext.Consumer>
                    <PanelContext.Consumer>
                        { context=><Sliceofinfo imgname='expsstaricon' val={context.expirience} text='Опыт'/>}
                    </PanelContext.Consumer>
                    <PanelContext.Consumer>
                        { context=><Sliceofinfo imgname='monetaicon' val={context.money} text='Баблишко'/>}
                    </PanelContext.Consumer>
                    <PanelContext.Consumer>
                            { context=><Sliceofinfo imgname='knowledgepointsicon' val={context.knowledgepoints}  text='Знания'/>}
                    </PanelContext.Consumer>
                    <PanelContext.Consumer>
                        { context=>  <Sliceofinfo imgname='vliyanieicon' val={context.power} text='Влияние'/>}
                    </PanelContext.Consumer>
                    <PanelContext.Consumer>
                        { context=><Sliceofinfo imgname='citiicin' val='/' text='Охват'/>}
                    </PanelContext.Consumer>
                    <PanelContext.Consumer>
                        { context=><Sliceofinfo imgname='parovozicon' val={context.trains} text='Свободно'/>}
                    </PanelContext.Consumer>
                </PanelContext.Provider>
            </div>
         );
    }


}
function Sliceofinfo(props){
    return(
      <div className='figuretoppanel'>
          <img className='icontoppanel' src={'./images/'+props.imgname+'.png'}/>
          <span>{props.text}</span>
          <span>{props.val}</span>
      </div>
    );
}
Window.renderTopPanel=function renderTopPanel(){
    ReactDOM.render(<Toppanelreact />, document.getElementById("toppanel"));
}
Window.renderTopPanel();
