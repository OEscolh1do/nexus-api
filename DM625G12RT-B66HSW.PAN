PVObject_=pvModule
  Version=7.4.5
  Flags=$00908043

  PVObject_Commercial=pvCommercial
    Comment=www.dmegcsolar.com  (China)
    Flags=$0041
    Manufacturer=DMEGC
    Model=DM625G12RT-B66HSW
    DataSource=Manufacturer
    YearBeg=2023
    Width=1.134
    Height=2.382
    Depth=0.030
    Weight=32.300
    NPieces=100
    PriceDate=25/08/23 19:57
    Remarks, Count=5
      Str_1=框架: Aluminium
      Str_2=结构: 2 mm tempered
      Str_3=连接: MC-4
      Str_4
      Str_5
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=625.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.780
  Isc=16.170
  Voc=49.29
  Imp=15.250
  Vmp=41.05
  muISC=7.76
  muVocSpec=-121.0
  muPmpReq=-0.290
  RShunt=800
  Rp_0=16000
  Rp_Exp=5.50
  RSerie=0.198
  Gamma=1.055
  muGamma=-0.0004
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=17.100
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellWidth=0.182
  CellHeight=0.105
  LIDLoss=1.00
  SandiaAMCorr=50.000

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=60.0,1.00000
      Point_5=70.0,0.97400
      Point_6=75.0,0.95300
      Point_7=80.0,0.89200
      Point_8=85.0,0.74600
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
