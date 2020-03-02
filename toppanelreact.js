"use strict"
class Toppanelreact extends React.Component{
    constructor(props){
        super(props);
    }
    componentDidMount() {

    }
    render(){

        return(
            <div id="toppanelreact">
                <Sliceofinfo imgname='levelicon' val='/' text='Уровень'/>
                <Sliceofinfo imgname='expsstaricon' val='/' text='Опыт'/>
                <Sliceofinfo imgname='monetaicon' val='/' text='Баблишко'/>
                <Sliceofinfo imgname='book' val='/'  text='Знания'/>
                <Sliceofinfo imgname='skipetr' val='/' text='Влияние'/>
                <Sliceofinfo imgname='citiicin' val='/' text='Охват'/>
                <Sliceofinfo imgname='parovozicon' val='/' text='Свободно'/>
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
ReactDOM.render(<Toppanelreact />, document.getElementById("toppanel"));
