"use strict";

let shedule=window.shedule;
let SheduleMember=window.shedule.SheduleMember;
let citymap=window.shedule.citymap;
let allrotescurvepaths=window.shedule.allrotescurvepaths;
let clock=window.clock;
function Row(props) {

    return(
        <form onClick={props.deletefunc} idrow={props.idrow} id="gridform">
            <Cellrect name={props.names[0]} keyrow={props.keyrow}  clssname={props.clssname} value={props.values.trainid} onChange={props.onChange} children={props.children.trains}/>
            <Cellrect name={props.names[1]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.fromcity} onChange={props.onChange} children={props.children.cities}/>
            <Cellrect name={props.names[2]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.tocity} onChange={props.onChange} children={props.children.cities}/>
            <Cellrectinput name={props.names[3]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.timego} onChange={props.onChange}/>
            <Cellrect name={props.names[4]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.daygo} onChange={props.onChange} children={props.children.dayofweek}/>
            <Cellrectinput name={props.names[5]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.timecome} onChange={props.onChange}/>
            <Cellrect name={props.names[6]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.daycome} onChange={props.onChange} children={props.children.dayofweek}/>
            <Cellrect name={props.names[7]} keyrow={props.keyrow} clssname={props.clssname} value={props.values.routnum} onChange={props.onChange} children={props.children.allrotescurvepaths}/>
        </form>
    );
}
function Cellrect(props) {
    return(
    <select name={props.name} keyrow={props.keyrow} onClick={props.onChange} onChange={props.onChange} value={props.value} className={props.clssname}>
        <option value='...'>...</option>
        {props.children}
    </select>
    );
}
function Cellrectinput(props) {
    return(
        <input type="text" name={props.name} keyrow={props.keyrow}  value={props.value} onChange={props.onChange} className={props.clssname} type="time">
        </input>
    );
}
function Messagebox(props) {
    return(
        <div id="messagebox">
            <p id='textstringmsgbox'>
            {props.text}
            </p>
        </div>
    );
}
class NewRowManager extends React.Component{//"trainid" fromcity tocity
    constructor(props) {
        super(props);
        this.state={
            rows:[],
            rowcount:0,
        };
        this.onChange = this.onChange.bind(this);
        this.addrow = this.addrow.bind(this);
        this.plusclick = this.plusclick.bind(this);
        this.deleterow = this.deleterow.bind(this);

        setInterval(()=>{
            if(getComputedStyle(this.routeswindow).visibility==='visible') {
                this.options.allrotescurvepaths=Array.from(allrotescurvepaths.keys()).map((value => <option key={value} value={`ЖД линия [${value}]`}>ЖД линия [${value}]</option> ));
                this.options.trains=Array.from(shedule.trainmap.keys()).map((value => <option key={value.id} value={`Состав № [${value}]`}>`Состав № [${value}]`</option> ));
            }
        },5000);

    }
    onChange(event){
        const name = event.target.name;
        const value=event.target.value;
        const rownum=event.target.getAttribute('keyrow');
        let newrows=this.state.rows.concat();
        let newrow=newrows[rownum];
        newrow[name]=value;
        this.setState({
            rows:newrows,
        });
    }
    addrow(){
        let newrows=this.state.rows.concat({
            trainid:"",
            fromcity:"",
            tocity:"",
            timego:"",
            daygo:'',
            timecome:"",
            daycome:'',
            routnum:'',
        });
        this.setState(prevState =>({
            rowcount:prevState.rowcount+1,
            rows:newrows,
        }));
    }
    plusclick(){
        this.addrow();
    }
    options={
        cities: Array.from(citymap.values()).map((value)=>value.name+`[${value.id}]`).map(value1=><option key={value1} value={value1}>{value1}</option>),
        allrotescurvepaths: Array.from(allrotescurvepaths.keys()).map((value => <option key={value.id} value={`ЖД линия [${value}]`}>`ЖД линия [${value}]`</option> )),
        trains:Array.from(shedule.trainmap.keys()).map((value => <option key={value.id} value={`Состав № [${value}]`}>`Состав № [${value}]`</option> )),
        dayofweek:(['ПН',"ВТ","СР","ЧТ","ПТ",'СБ','ВС']).map(value => <option key={value} value={value}>{value}</option>),
    };
    masrow=[];
    names=['trainid','fromcity','tocity','timego','daygo','timecome','daycome','routnum'];
    routeswindow=document.getElementById('RoutesWindow');
    deleteregime=false;
    async deleterow(e){
        await e.persist();
        e.preventDefault();
        if(this.deleteregime){
            e.stopPropagation();
            let divforasking=document.getElementById('divforasking');
            divforasking.style.visibility='visible';
            ReactDOM.render(<AskedWindow />, document.getElementById("divforasking"));
            let responseuser=await this.askuser();
            divforasking.style.visibility='hidden';
            if (!responseuser)
                return;

            let formdel=e.target.form;
            let rowdelid=this.state.rows[formdel.getAttribute("idrow")];
            let newrows=this.state.rows.concat();
            newrows.splice(rowdelid,1);
            this.setState(prevState =>({
                rowcount:prevState.rowcount-1,
                rows:newrows,
            }));
        }
    }
    async askuser(){
        let response=undefined;
        function handler(e) {
            e.stopPropagation();
            response=e.response;
            this.removeEventListener('userresponse',handler)

        }
        this.routeswindow.addEventListener('userresponse',handler);
        await new Promise((resolve => {
            setTimeout(function f (){
                if (response===undefined)
                 setTimeout(f,300);
                else resolve(response);
             },300);
        }));
        return response === 'yes';
    }
    render(){
        const masrow=this.masrow.concat();
        let textformessage=`ВНИМАНИЕ:   `;
        let appendincorrectinputmsg=false;
        shedule.shedulemap.clear;
        this.state.rows.forEach((value,index) => {
            let flagout=false;
            Object.values(value).forEach((val)=>{
                if (val===''||val==='...')
                    flagout=true;
            });
            if (flagout===false) {
                const weekdaygo = this.options.dayofweek.map(value1 => value1.key).indexOf(value.daygo);
                const delivertimego = value.timego.split(":");
                const hourgo = delivertimego[0];
                const minutesgo = delivertimego[1];
                const timestampgo = weekdaygo * 24 * 3600 * 1000 + (+hourgo) * 3600 * 1000 + (+minutesgo) * 60 * 1000;

                const weekdaycome = this.options.dayofweek.map(value1 => value1.key).indexOf(value.daycome);;
                const delivertimecome = value.timecome.split(":");
                const hourcome = delivertimecome[0];
                const minutescome = delivertimecome[1];
                const timestampcome = weekdaycome * 24 * 3600 * 1000 + (+hourcome) * 3600 * 1000 + (+minutescome) * 60 * 1000;

                const duration = Math.abs((timestampcome - timestampgo) / (clock.clocktimedelta / clock.settimeoutclockparametr));

                const roadindex = value.routnum.match(/\d+/);
                const road = allrotescurvepaths.get(+roadindex[0]);

                const trainindex = value.trainid.match(/\d+/);
                const train = shedule.trainmap.get(+trainindex[0]);

                const cityfromid = value.fromcity.match(/\d+/);
                const citytoid = value.tocity.match(/\d+/);
                const cityfrom = citymap.get(+cityfromid[0]);
                const cityto = citymap.get(+citytoid[0]);



                const newshedulemember=new SheduleMember(timestampgo, road, train, duration, cityfrom, cityto);
                newshedulemember.isreadyforgo=true;
                shedule.shedulemap.set(index, newshedulemember);
                masrow.push(<Row idrow={index}  key={index} clssname='cellrow' keyrow={index}
                                 onChange={this.onChange} deletefunc={this.deleterow} values={value} names={this.names} children={this.options}/>);
            }
            else
            {
                masrow.push(<Row key={index} idrow={index} clssname='cellrowundefined' keyrow={index}
                                 onChange={this.onChange} deletefunc={this.deleterow} values={value} names={this.names} children={this.options}/>);
                appendincorrectinputmsg=true;
            }

        });
        if (appendincorrectinputmsg)
            textformessage+=`ОДИН ИЛИ НЕСКОЛЬКО ПАРАМЕТРОВ ОТПРАВЛЕНИЯ НЕ ОПРЕДЕЛЕНЫ\n`;
        if (this.deleteregime)
            textformessage="ОСТОРОЖНО: ВКЛЮЧЕН РЕЖИМ УДАЛЕНИЯ";
        console.log(shedule);
        return(
            <div id="NewRowManager">
                <div id="innerrowgroup">{masrow}</div>
            <img src="images/plusshedule.png" onClick={()=>this.plusclick()} id="plusshedule" key="plusshedule"/>
            <img src="images/krestikdlyokon.png" id="exitroutwindowbtn"
                 onClick={()=>{ if(this.deleteregime) this.deleteregime=false; else this.deleteregime=true;this.setState({});}} key="exitroutwindowbtn"/>
           <Messagebox text={textformessage}/>
           <div id='divforasking'></div>
            </div>
        );
    }
}
class AskedWindow extends React.Component{
    constructor(props) {
        super(props);
    }
    RoutesWindow=document.getElementById('RoutesWindow');
    render(){
        return(
            <div id='answeruser'>
                <div>Вы уверены, что хотите удалить рейс? Это необратимо!!!</div>

                <img style={{float: 'left'}} name='yes' className='iconresp' src='./images/galochka.png' onClick={()=>{
                    let userresponseevent=new Event('userresponse');
                    userresponseevent.response='yes';
                    this.RoutesWindow.dispatchEvent(userresponseevent);
                }} />
                <img style={{float: 'right'}} name='no' className='iconresp' onClick={()=>{
                    let userresponseevent=new Event('userresponse');
                    userresponseevent.response='no';
                    this.RoutesWindow.dispatchEvent(userresponseevent);
                }} src='./images/krestik.png'/>
            </div>
        );
    }
    }
ReactDOM.render(<NewRowManager />, document.getElementById("groupofrows"));
